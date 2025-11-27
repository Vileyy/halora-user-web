"use client";

import Header from "@/components/Header";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, Facebook, Instagram } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Gửi tin nhắn thành công!", {
      description: "Chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất.",
    });

    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      content: "contact@haloracosmetic.com",
      link: "mailto:contact@haloracosmetic.com",
      color: "from-pink-500 to-rose-500",
    },
    {
      icon: Phone,
      title: "Điện thoại",
      content: "+84 123 456 789",
      link: "tel:+84123456789",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: MapPin,
      title: "Địa chỉ",
      content: "123 Đường ABC, Phường XYZ, Quận 1, TP. HCM",
      link: null,
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Clock,
      title: "Giờ làm việc",
      content: "T2-T6: 8:00-20:00 | T7-CN: 9:00-18:00",
      link: null,
      color: "from-green-500 to-teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-600 via-rose-500 to-pink-700 py-16 md:py-20">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-rose-300/20 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-2xl mx-auto text-center text-white"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Liên hệ với chúng tôi
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg text-pink-50 leading-relaxed"
            >
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto"
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-pink-100 hover:shadow-xl transition-all"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${info.color} rounded-lg flex items-center justify-center mb-4`}
                >
                  <info.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">
                  {info.title}
                </h3>
                {info.link ? (
                  <a
                    href={info.link}
                    className="text-gray-900 hover:text-pink-600 transition-colors font-medium text-sm"
                  >
                    {info.content}
                  </a>
                ) : (
                  <p className="text-gray-900 font-medium text-sm">
                    {info.content}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-xl p-8 border border-pink-100"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Gửi tin nhắn cho chúng tôi
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-gray-900"
                    placeholder="Nhập họ và tên của bạn"
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-gray-900"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-gray-900"
                      placeholder="+84 123 456 789"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-gray-900"
                    placeholder="Chủ đề tin nhắn"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all resize-none text-gray-900"
                    placeholder="Nhập nội dung tin nhắn..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold py-4 rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Gửi tin nhắn</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-6"
            >
              {/* Map placeholder */}
              <motion.div
                variants={fadeInUp}
                className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl shadow-lg p-8 h-64 flex items-center justify-center border border-pink-200"
              >
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-pink-600 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium">
                    123 Đường ABC, Phường XYZ
                  </p>
                  <p className="text-gray-600">Quận 1, TP. Hồ Chí Minh</p>
                </div>
              </motion.div>

              {/* Social Media */}
              <motion.div
                variants={fadeInUp}
                className="bg-white rounded-2xl shadow-lg p-8 border border-pink-100"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Kết nối với chúng tôi
                </h3>
                <p className="text-gray-600 mb-6">
                  Theo dõi Halora trên mạng xã hội để cập nhật tin tức và ưu đãi mới nhất
                </p>
                <div className="flex space-x-4">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <Facebook className="w-5 h-5" />
                    <span className="font-medium">Facebook</span>
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-4 rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <Instagram className="w-5 h-5" />
                    <span className="font-medium">Instagram</span>
                  </a>
                </div>
              </motion.div>

              {/* FAQ */}
              <motion.div
                variants={fadeInUp}
                className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-lg p-8 border border-pink-100"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Câu hỏi thường gặp
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Thời gian phản hồi là bao lâu?
                    </p>
                    <p className="text-gray-600">
                      Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Có hỗ trợ tư vấn trực tuyến không?
                    </p>
                    <p className="text-gray-600">
                      Có, bạn có thể liên hệ qua email hoặc mạng xã hội.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
