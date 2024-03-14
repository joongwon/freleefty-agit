"use client";
import Moment from "react-moment";
import moment from "moment";
import "moment/locale/ko";

/* parse dates in UTC */
Moment.globalMoment = moment.utc;

/**
 * A component that displays a time in a human-readable format.
 * If the time is within 3 days, it will be displayed as "x일 전", "x시간 전", or "x분 전".
 * Otherwise, it will be displayed as "x년 x월 x일".
 */
export default function Time(p: { children: string }) {
  return (
    <Moment
      fromNowDuring={3 * 24 * 60 * 60 * 1000}
      format="YYYY년 M월 D일"
      withTitle
      titleFormat="YYYY년 M월 D일 HH:mm:ss"
      local
      locale="ko"
      // time may not match due to time zone differences
      suppressHydrationWarning
    >
      {p.children}
    </Moment>
  );
}

// passing suppressHydrationWarning to Moment fails type checking
declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      suppressHydrationWarning?: boolean;
    }
  }
}
