import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-lexia-bg p-4">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/cases" />
    </div>
  );
}
