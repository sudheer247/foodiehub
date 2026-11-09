import "./globals.css";

export const metadata = {
  title: "FoodieHub | Online Food Ordering",
  description: "Discover your favorite dishes and order them online."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
