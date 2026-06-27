"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Mail,
  Lock,
  Check,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import styles from "./signup.module.css";

// 1. Zod validation schema
const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms of Service",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

type Strength = "none" | "weak" | "fair" | "strong";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // 2. Setup react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    mode: "onChange", // Enable inline validation on input change
  });

  const passwordValue = watch("password", "");

  // 3. Password strength evaluation
  const getPasswordStrength = (pwd: string): Strength => {
    if (!pwd) return "none";
    if (pwd.length < 6) return "weak";

    let score = 0;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (pwd.length >= 8 && score >= 3) return "strong";
    if (pwd.length >= 6 && score >= 2) return "fair";
    return "weak";
  };

  const strength = getPasswordStrength(passwordValue);

  const strengthLabels: Record<Strength, { label: string; class: string }> = {
    none: { label: "No password", class: styles["strength-none"] },
    weak: { label: "Weak", class: styles["strength-weak"] },
    fair: { label: "Fair", class: styles["strength-fair"] },
    strong: { label: "Strong", class: styles["strength-strong"] },
  };

  // 4. Form Submit handler
  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setApiError(null);

    // Simulate API Request
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (data.email.toLowerCase() === "taken@example.com") {
      setApiError("This email address is already in use.");
      setError("email", {
        type: "manual",
        message: "Email address is already taken",
      });
      setIsLoading(false);
    } else {
      // Success: Redirect to dashboard
      router.push(`/dashboard?name=${encodeURIComponent(data.fullName)}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>Hamplard</div>
          <p className={styles.subtitle}>Create your account to get started</p>
        </div>

        {apiError && (
          <div className={styles.apiErrorBanner}>
            <AlertCircle size={16} />
            <span>{apiError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className={styles.form}
          noValidate
        >
          {/* Full Name */}
          <div className={styles.formGroup}>
            <label htmlFor="fullName" className={styles.label}>
              Full Name
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="fullName"
                type="text"
                disabled={isLoading}
                placeholder="John Doe"
                className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                {...register("fullName")}
              />
              <User size={16} className={styles.inputIcon} />
            </div>
            {errors.fullName && (
              <span className={styles.errorMessage}>
                <AlertCircle size={12} /> {errors.fullName.message}
              </span>
            )}
          </div>

          {/* Email Address */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="email"
                type="email"
                disabled={isLoading}
                placeholder="you@example.com"
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                {...register("email")}
              />
              <Mail size={16} className={styles.inputIcon} />
            </div>
            {errors.email && (
              <span className={styles.errorMessage}>
                <AlertCircle size={12} /> {errors.email.message}
              </span>
            )}
          </div>

          {/* Password */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="password"
                type="password"
                disabled={isLoading}
                placeholder="••••••••"
                className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                {...register("password")}
              />
              <Lock size={16} className={styles.inputIcon} />
            </div>
            {errors.password && (
              <span className={styles.errorMessage}>
                <AlertCircle size={12} /> {errors.password.message}
              </span>
            )}

            {/* Password Strength Indicator */}
            {passwordValue && (
              <div className={styles.strengthMeter}>
                <div className={styles.strengthLabel}>
                  <span>Password Strength:</span>
                  <span
                    className={`${styles.strengthValue} ${strengthLabels[strength].class}`}
                  >
                    {strengthLabels[strength].label}
                  </span>
                </div>
                <div className={styles.strengthBars}>
                  <div
                    className={`${styles.bar} ${
                      strength !== "none" ? styles["bar-weak"] : ""
                    }`}
                  />
                  <div
                    className={`${styles.bar} ${
                      strength === "fair" || strength === "strong"
                        ? styles["bar-fair"]
                        : ""
                    }`}
                  />
                  <div
                    className={`${styles.bar} ${
                      strength === "strong" ? styles["bar-strong"] : ""
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="confirmPassword"
                type="password"
                disabled={isLoading}
                placeholder="••••••••"
                className={`${styles.input} ${
                  errors.confirmPassword ? styles.inputError : ""
                }`}
                {...register("confirmPassword")}
              />
              <Lock size={16} className={styles.inputIcon} />
            </div>
            {errors.confirmPassword && (
              <span className={styles.errorMessage}>
                <AlertCircle size={12} /> {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {/* Terms of Service Checkbox */}
          <div className={styles.formGroup}>
            <label htmlFor="terms" className={styles.checkboxGroup}>
              <div className={styles.checkboxContainer}>
                <input
                  id="terms"
                  type="checkbox"
                  disabled={isLoading}
                  className={styles.checkboxInput}
                  {...register("terms")}
                />
                <div className={styles.customCheckbox}>
                  <Check
                    className={styles.checkmark}
                    size={12}
                    strokeWidth={3}
                  />
                </div>
              </div>
              <span className={styles.checkboxLabel}>
                I agree to the <Link href="/terms">Terms of Service</Link> and{" "}
                <Link href="/privacy">Privacy Policy</Link>
              </span>
            </label>
            {errors.terms && (
              <span className={styles.errorMessage}>
                <AlertCircle size={12} /> {errors.terms.message}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitBtn}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Sign Up</span>
              </>
            )}
          </button>
        </form>

        <div className={styles.divider}>or register with</div>

        {/* Social Buttons */}
        <div className={styles.socialContainer}>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => alert("Google Signup mock triggered!")}
            className={styles.socialBtn}
          >
            {/* Custom Premium Google SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>Google</span>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => alert("Facebook Signup mock triggered!")}
            className={styles.socialBtn}
          >
            {/* Custom Premium Facebook SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
          </button>
        </div>

        <div className={styles.footer}>
          Already have an account?
          <Link href="/login" className={styles.footerLink}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
