import Image from "next/image";
import logo from "@/public/logo.webp";

export default function Logo({ width = 140, priority = false }) {
  return <Image src={logo} alt="Detechpro – Integrating Solutions" width={width} height={Math.round((width * logo.height) / logo.width)} priority={priority} className="logo" />;
}
