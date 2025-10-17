import Stripe from "stripe";
import { Webhook } from "svix";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";
import Course from "../models/Course.js";

// ### CLERK WEBHOOK ###
// Handles creating and updating users in your database when they sign up or change details in Clerk.
export const clerkWebhooks = async (req, res) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      throw new Error("You need a CLERK_WEBHOOK_SECRET in your .env");
    }

    // Get the headers and body
    const headers = req.headers;
    const payload = req.body;
    const svix_id = headers["svix-id"];
    const svix_timestamp = headers["svix-timestamp"];
    const svix_signature = headers["svix-signature"];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).send("Error occurred -- no svix headers");
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
      evt = wh.verify(JSON.stringify(payload), {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Error verifying webhook:", err.message);
      return res.status(400).send("Error occurred");
    }

    const { id } = evt.data;
    const eventType = evt.type;

    // Handle user creation in your DB
    if (eventType === "user.created") {
      const { email_addresses, image_url, first_name, last_name } = evt.data;

      await User.create({
        _id: id,
        email: email_addresses[0].email_address,
        name: `${first_name || ""} ${last_name || ""}`.trim(),
        imageUrl: image_url,
        enrolledCourses: [],
      });

      console.log(`Webhook received: New user ${id} created in DB.`);
    }

    res.status(200).json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error("Clerk Webhook Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ### STRIPE WEBHOOK ###
// Handles enrolling users in courses after a successful payment.
export const stripeWebhooks = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const sig = req.headers["stripe-signature"];
  const rawBody = req.body;

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.sendStatus(400);
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("Stripe checkout session completed event received for:", session.id);

    try {
      const purchaseId = session.metadata.purchaseId;
      if (!purchaseId) {
        return console.error("Webhook Error: purchaseId missing from session metadata.");
      }

      const purchase = await Purchase.findById(purchaseId);
      if (!purchase) {
        return console.error(`Webhook Error: Purchase with ID ${purchaseId} not found.`);
      }

      // Add the course to the user's enrolled list
      await User.findByIdAndUpdate(purchase.userId, {
        $push: { enrolledCourses: purchase.courseId },
      });

      // Add the user to the course's student list
      await Course.findByIdAndUpdate(purchase.courseId, {
        $push: { enrolledStudents: purchase.userId },
      });

      // Mark the purchase as completed
      purchase.status = "completed";
      await purchase.save();

      console.log(`Successfully enrolled user ${purchase.userId} in course ${purchase.courseId}.`);
    } catch (dbError) {
      console.error("Stripe Webhook DB Error:", dbError.message);
    }
  } else {
    console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).send();
};