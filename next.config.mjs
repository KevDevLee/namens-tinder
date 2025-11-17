import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
});

export default withPWA({
  reactStrictMode: false,
  // 👇 THIS LINE FORCES WEBPACK INSTEAD OF TURBOPACK
  experimental: {
    turbo: false,
  },
});
