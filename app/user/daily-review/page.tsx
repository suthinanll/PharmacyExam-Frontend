import type { Metadata } from "next";
import DailyReviewClient from "./DailyReviewClient";

export const metadata: Metadata = {
  title: "ทบทวนประจำวัน | เภสัชพร้อมสอบ",
};

export default function DailyReviewPage() {
  return <DailyReviewClient />;
}
