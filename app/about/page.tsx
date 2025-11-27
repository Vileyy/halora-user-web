"use client";

import Header from "@/components/Header";
import { motion } from "framer-motion";
import {
  Sparkles,
  Heart,
  Award,
  Leaf,
  Shield,
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const values = [
    {
      icon: Heart,
      title: "Tận tâm",
      description:
        "Đặt khách hàng lên hàng đầu, mang đến trải nghiệm mua sắm tuyệt vời.",
      color: "from-pink-500 to-rose-500",
    },
    {
      icon: Award,
      title: "Chất lượng",
      description:
        "Cam kết sản phẩm chính hãng, nguồn gốc rõ ràng, an toàn cho làn da.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Leaf,
      title: "Tự nhiên",
      description:
        "Ưu tiên sản phẩm từ thiên nhiên, thân thiện với môi trường.",
      color: "from-green-500 to-teal-500",
    },
    {
      icon: Shield,
      title: "Uy tín",
      description: "Minh bạch trong mọi giao dịch, cam kết chất lượng phục vụ.",
      color: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50">
      <Header />

      {/* Story Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Về Halora Cosmetic
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-rose-500 mx-auto rounded-full" />
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border border-pink-100"
            >
              <div className="space-y-5">
                <p className="text-gray-700 leading-relaxed text-lg">
                  <span className="text-pink-600 font-bold text-xl">
                    Halora Cosmetic
                  </span>{" "}
                  là điểm đến tin cậy cho những ai yêu thích làm đẹp và mong
                  muốn chăm sóc bản thân bằng những sản phẩm chất lượng cao.
                </p>

                <p className="text-gray-700 leading-relaxed">
                  Chúng tôi mang đến đa dạng các sản phẩm mỹ phẩm từ các thương
                  hiệu uy tín, được tuyển chọn kỹ lưỡng để đảm bảo an toàn và
                  hiệu quả cho làn da của bạn.
                </p>

                <p className="text-gray-700 leading-relaxed">
                  Với sứ mệnh giúp mỗi người tỏa sáng phiên bản đẹp nhất của
                  chính mình, Halora cam kết không chỉ cung cấp sản phẩm chất
                  lượng mà còn mang đến trải nghiệm mua sắm tuyệt vời và dịch vụ
                  tư vấn tận tâm. ✨
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-white to-pink-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Giá trị cốt lõi
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Những giá trị định hướng mọi hoạt động của Halora
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${value.color} rounded-lg flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Liên hệ với chúng tôi
              </h2>
              <p className="text-gray-600">
                Hãy để Halora đồng hành cùng bạn trên hành trình làm đẹp
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info Card */}
              <motion.div
                variants={fadeInUp}
                className="bg-white rounded-xl shadow-lg p-8 border border-pink-100"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Thông tin liên hệ
                </h3>

                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <a
                        href="mailto:contact@haloracosmetic.com"
                        className="text-gray-900 hover:text-pink-600 transition-colors font-medium"
                      >
                        contact@haloracosmetic.com
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Điện thoại</p>
                      <a
                        href="tel:+84123456789"
                        className="text-gray-900 hover:text-pink-600 transition-colors font-medium"
                      >
                        +84 364905240
                      </a>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Địa chỉ</p>
                      <p className="text-gray-900 font-medium">
                        02 Công trường Công xã Paris, Bến Nghé,
                        <br />
                        Quận 1, TP. Hồ Chí Minh
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Social Media & Hours Card */}
              <motion.div
                variants={fadeInUp}
                className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl shadow-lg p-8 border border-pink-100"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Kết nối với chúng tôi
                </h3>

                {/* Social Media */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-3">Mạng xã hội</p>
                  <div className="flex space-x-3">
                    <a
                      href="https://www.facebook.com/canyouseemylove/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all shadow-md hover:shadow-lg group"
                    >
                      <Facebook className="w-5 h-5 text-pink-600 group-hover:text-white" />
                    </a>
                    <a
                      href="https://www.instagram.com/d.hieu2104/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all shadow-md hover:shadow-lg group"
                    >
                      <Instagram className="w-5 h-5 text-pink-600 group-hover:text-white" />
                    </a>
                  </div>
                </div>

                {/* Working Hours */}
                <div>
                  <p className="text-sm text-gray-600 mb-3">Giờ làm việc</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Thứ 2 - Thứ 6:</span>
                      <span className="font-medium text-gray-900">
                        8:00 - 20:00
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Thứ 7 - Chủ nhật:</span>
                      <span className="font-medium text-gray-900">
                        9:00 - 18:00
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-pink-600 via-rose-500 to-pink-700">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-2xl mx-auto text-center text-white"
          >
            <motion.div variants={fadeInUp}>
              <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Bắt đầu hành trình làm đẹp
            </motion.h2>

            <motion.p variants={fadeInUp} className="text-lg text-pink-50 mb-8">
              Khám phá bộ sưu tập sản phẩm chăm sóc da chất lượng cao của Halora
            </motion.p>

            <motion.div variants={fadeInUp}>
              <Link
                href="/#new-products"
                className="inline-block bg-white text-pink-600 px-8 py-3 rounded-lg font-bold hover:bg-pink-50 transition-all shadow-lg hover:shadow-xl"
              >
                Khám phá sản phẩm
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
