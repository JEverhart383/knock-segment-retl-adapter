export const metadata = {
  title: "Knock Segment RETL Adapter",
  description: "Adapter between Segment Reverse ETL and Knock static audiences",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
