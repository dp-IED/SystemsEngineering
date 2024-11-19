import { hostname } from "os";

const config = {
  // Your Next.js config
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ok4static.oktacdn.com",
        port:'',
        pathname: "/fs/bco/1/fs012r07i1rX4ZtdW1t8",
      }
    ]
  }
};

export default config;