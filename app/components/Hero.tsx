"use client";

import { motion } from "framer-motion";
import { ChevronDown, Flame, Clock, MapPin } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 bg-[#F5821F]/20 rounded-full blur-[100px]"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#5C3410]/40 rounded-full blur-[100px]"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F5821F]/10 rounded-full blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-20 right-10 w-20 h-20 border-2 border-[#F5821F]/30 rounded-full"
        animate={{
          y: [0, -30, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute bottom-32 left-10 w-16 h-16 bg-[#F5821F]/10 rounded-lg"
        animate={{
          y: [0, 20, 0],
          rotate: [0, -10, 10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-40 left-1/4 w-4 h-4 bg-[#F5821F] rounded-full"
        animate={{
          y: [0, -40, 0],
          opacity: [1, 0.3, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5821F]/10 border border-[#F5821F]/30 rounded-full">
            <Flame className="w-4 h-4 text-[#F5821F]" />
            <span className="text-[#F5821F] text-sm font-medium">
              Sabores Auténticos Chilenos
            </span>
          </div>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
          style={{ fontFamily: "var(--font-fredoka), system-ui, sans-serif" }}
        >
          <span className="text-gradient">MC Tommy</span>
          <br />
          <span className="text-[#3D1F00]">Comida Rápida</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl sm:text-2xl text-[#3D1F00]/70 mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          El mejor sabor chileno, directo a tu mesa.
          <span className="text-[#F5821F] font-semibold">
            {" "}
            Papas supremas, fajitas, pollo asado
          </span>{" "}
          y mucho más.
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-10"
        >
          {[
            { icon: Clock, text: "Entrega Rápida" },
            { icon: Flame, text: "Recetas Caseras" },
            { icon: MapPin, text: "Delivery Local" },
          ].map((feature, index) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
              className="flex items-center gap-2 px-4 py-2 bg-[#3D1F00]/5 backdrop-blur-sm rounded-full border border-[#3D1F00]/10"
            >
              <feature.icon className="w-4 h-4 text-[#F5821F]" />
              <span className="text-[#3D1F00]/70 text-sm">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.a
            href="#menu"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#F5821F] text-white font-bold rounded-2xl text-lg shadow-lg shadow-[#F5821F]/30 relative overflow-hidden group"
            style={{ fontFamily: "var(--font-fredoka), system-ui, sans-serif" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Ver Menú Completo</span>
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
          </motion.a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.a
            href="#menu"
            className="flex flex-col items-center gap-2 text-[#3D1F00]/40 hover:text-[#3D1F00]/70 transition-colors"
          >
            <span className="text-xs">Desplaza para explorar</span>
            <ChevronDown className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
