import '../globals.css';

export const metadata = { title: 'Admin · johnjanjani.com', robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <body className="admin">{children}</body>
    </html>
  );
}
