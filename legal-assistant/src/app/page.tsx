import { redirect } from "next/navigation";

// The dashboard is the whole MVP, so the home page simply sends people there.
export default function Home() {
  redirect("/dashboard");
}
