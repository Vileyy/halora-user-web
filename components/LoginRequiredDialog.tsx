"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Lock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
      delay: 0.2,
    },
  },
  exit: {
    scale: 0,
    rotate: 180,
    transition: {
      duration: 0.2,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.98,
  },
};

const blurCircleVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 50,
      damping: 20,
    },
  },
};

export function LoginRequiredDialog({
  open,
  onOpenChange,
}: LoginRequiredDialogProps) {
  const router = useRouter();

  const handleLogin = () => {
    onOpenChange(false);
    router.push("/login");
  };

  const handleRegister = () => {
    onOpenChange(false);
    router.push("/register");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white border-0 shadow-2xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 px-6 pt-8 pb-6"
        >
              {/* Blur circles với animation */}
              <motion.div
                variants={blurCircleVariants}
                className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                variants={blurCircleVariants}
                className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />

              <div className="relative flex flex-col items-center text-center">
                {/* Icon với animation */}
                <motion.div
                  variants={iconVariants}
                  className="mb-4 relative"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring" as const, stiffness: 300 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-full blur-xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="relative bg-white/20 backdrop-blur-sm rounded-full p-4 border-2 border-white/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Lock className="w-8 h-8 text-white" />
                  </motion.div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <DialogTitle className="text-2xl font-bold text-white mb-2">
                    Yêu cầu đăng nhập
                  </DialogTitle>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <DialogDescription className="text-pink-50 text-sm max-w-sm">
                    Để tiếp tục mua sắm, vui lòng đăng nhập hoặc tạo tài khoản
                    mới
                  </DialogDescription>
                </motion.div>
              </div>
        </motion.div>

        {/* Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="px-6 py-6 space-y-4"
        >
              <motion.div
                variants={itemVariants}
                className="flex items-start space-x-3 p-4 bg-pink-50 rounded-lg border border-pink-100"
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <Sparkles className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
                </motion.div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Đăng nhập để thêm sản phẩm vào giỏ hàng, theo dõi đơn hàng và
                  nhận nhiều ưu đãi đặc biệt từ Halora!
                </p>
              </motion.div>

              <DialogFooter className="flex-col sm:flex-row gap-3 pt-2">
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="w-full sm:flex-1"
                >
                  <Button
                    variant="outline"
                    onClick={handleRegister}
                    className="w-full border-2 border-gray-300 hover:border-pink-500 hover:bg-pink-50 hover:text-pink-600 font-semibold py-6"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Đăng ký
                  </Button>
                </motion.div>
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="w-full sm:flex-1"
                >
                  <Button
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold py-6 shadow-lg hover:shadow-xl"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Đăng nhập
                  </Button>
                </motion.div>
              </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

