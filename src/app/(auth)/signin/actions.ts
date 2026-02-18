"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function signInAction(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false, // let us handle the redirect below
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Invalid email or password. Please try again.";
    }
    console.error("[signInAction]", error);
    return "Something went wrong. Please try again later.";
  }
  // redirect() must be called outside try/catch so Next.js can handle it
  redirect("/feed");
}
