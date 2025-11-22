import Header from "@/components/Header";
import BannerCarousel from "@/components/BannerCarousel";
import FlashDeals from "@/components/FlashDeals";
import Categories from "@/components/Categories";
import NewProducts from "@/components/NewProducts";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-4 max-w-7xl">
        <BannerCarousel />
        <FlashDeals />
        <Categories />
        <NewProducts />
      </main>
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Halora Cosmetic</h3>
              <p className="text-gray-400">
                Chuyên cung cấp các sản phẩm mỹ phẩm chính hãng, chất lượng cao.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Về chúng tôi</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Giới thiệu
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Liên hệ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Tuyển dụng
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Câu hỏi thường gặp
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Chính sách đổi trả
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Hướng dẫn mua hàng
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liên hệ</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: support@halora.com</li>
                <li>Hotline: 1900-xxxx</li>
                <li>Giờ làm việc: 8:00 - 22:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Halora Cosmetic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
