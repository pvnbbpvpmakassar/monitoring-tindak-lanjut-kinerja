export default async function DetailTindakLanjutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main>
      <h1>Detail Tindak Lanjut</h1>
      <p>ID: {id}</p>
    </main>
  );
}