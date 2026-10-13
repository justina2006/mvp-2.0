import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllIds, getById, getDestino } from "@/lib/repository";
import DetalleRecomendacion from "@/components/DetalleRecomendacion";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return (await getAllIds()).map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rec = await getById((await params).id);
  return rec ? { title: rec.nombre, description: rec.descripcion } : {};
}

export default async function RecomendacionPage({ params }: Props) {
  const { id } = await params;
  const rec = await getById(id);
  if (!rec) notFound();
  const destino = await getDestino(rec.destino);
  return <DetalleRecomendacion rec={rec} nombreDestino={destino?.nombre ?? rec.destino} />;
}
