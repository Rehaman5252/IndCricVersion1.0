"use client";

import React, { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Validation schemas
 * signupSchema includes confirmPassword via a refinement
 */
const signupSchema = z
  .object({
    name: z.string().min(3, { message: "Name must be at least 3 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().regex(/^\d{10}$/, { message: "Please enter a valid 10-digit phone number." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string().min(8, { message: "Please confirm your password." }),
    referralCode: z.string().optional(),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions to continue.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const GoogleIcon = (
  <svg
    className="mr-2 h-4 w-4"
    aria-hidden="true"
    focusable="false"
    data-prefix="fab"
    data-icon="google"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 488 512"
  >
    <path
      fill="currentColor"
      d="M488 261.8C488 403.3 381.5 512 244 512S0 403.3 0 261.8C0 120.3 106.5 8 244 8s244 112.3 244 253.8zM138.3 336.7c-21.7-21.7-33.2-50.2-33.2-80.1s11.5-58.4 33.2-80.1c21.7-21.7 50.2-33.2 80.1-33.2s58.4 11.5 80.1 33.2c21.7 21.7 33.2 50.2 33.2 80.1s-11.5 58.4-33.2 80.1c-21.7-21.7-50.2-33.2-80.1-33.2s-58.4 11.5-80.1-33.2z"
    />
  </svg>
);

function AuthFormComponent({ type }: { type: "login" | "signup" }) {
  const { registerWithEmail, loginWithEmail, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast(); // <-- destructured so `toast(...)` is callable

  // password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // pick schema at runtime
  const formSchema = type === "login" ? loginSchema : signupSchema;

  // NOTE: using `any` here avoids complex generic mismatch between dynamic schema and Controller typing.
  const form = useForm<any>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      referralCode: searchParams.get("ref") ?? "",
      terms: false,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: any) => {
    const from = searchParams.get("from") ?? "/";
    let result = null;

    if (type === "signup") {
      const { name, email, phone, password, referralCode } = values;
      result = await registerWithEmail(name, email, phone, password, referralCode);

      if (result) {
        toast({
          title: "Signup Successful!",
          description:
            "A verification link has been sent to your email. Please verify to continue.",
        });
      }
    } else {
      const { email, password } = values;
      result = await loginWithEmail(email, password);

      if (result) {
        router.replace(from);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const from = searchParams.get("from") ?? "/";
    const result = await signInWithGoogle();

    if (result) {
      router.replace(from);
    }
  };

  if (user) {
    const from = searchParams.get("from") ?? "/";
    router.replace(from);
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{type === "login" ? "Time to Bat Again!" : "Join the Squad!"}</CardTitle>
        <CardDescription>
          {type === "login"
            ? "Welcome back, player! Log in to face the next challenge."
            : "Sign up to start your cricket journey and climb the leaderboard."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* cast Form to any to avoid stricter prop inference issues from the library */}
        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {type === "signup" && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === "signup" && (
              <FormField
                control={form.control}
                name="phone"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="10-digit number" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PASSWORD */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        {...field}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CONFIRM PASSWORD (signup only) */}
            {type === "signup" && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="••••••••"
                          type={showConfirmPassword ? "text" : "password"}
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={isSubmitting}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === "signup" && (
              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Referral Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter code from a friend" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* TERMS (signup only) */}
            {type === "signup" && (
              <FormField
                control={form.control}
                name="terms"
                render={({ field }: any) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={Boolean(field.value)}
                        // convert checkbox change to RHF onChange signature
                        onCheckedChange={(v: boolean | "indeterminate") => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I acknowledge this platform is for testing cricket knowledge only, and not for
                        entertainment, financial gain, or gambling. I accept the{" "}
                        <Button variant="link" asChild className="p-1 h-auto">
                          <Link href="/policies" target="_blank" rel="noopener noreferrer">
                            Terms & Conditions
                          </Link>
                        </Button>
                        .
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === "login" ? "Login" : "Sign Up"}
            </Button>
          </form>
        </Form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
          {GoogleIcon}
          Google
        </Button>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {type === "login" ? "Don't have an account? " : "Already have an account? "}
          <Button variant="link" asChild className="p-1">
            <Link
              href={
                type === "login"
                  ? `/auth/signup?${searchParams.toString()}`
                  : `/auth/login?${searchParams.toString()}`
              }
            >
              {type === "login" ? "Sign Up" : "Login"}
            </Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function AuthForm(props: { type: "login" | "signup" }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      }
    >
      <AuthFormComponent {...props} />
    </Suspense>
  );
}
