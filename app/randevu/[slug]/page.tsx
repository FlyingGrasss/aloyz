import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingClient from "./BookingClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { name: true, type: true },
  });
  if (!business) return { title: "Randevu | Aloyz" };
  return {
    title: `${business.name} Randevu | Aloyz`,
    description: `${business.name} için online randevu oluşturun.`,
  };
}

export default async function BookingPage({ params }: PageProps) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!business) notFound();

  return <BookingClient slug={slug} />;
}
