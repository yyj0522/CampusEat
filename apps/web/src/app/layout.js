import "./globals.css";

export const metadata = {
  title: "CampusEat",
  description: "CampusEat Web App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
