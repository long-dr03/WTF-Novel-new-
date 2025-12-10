"use client"

import { useState } from "react";
import { Banner_carousel } from "@/components/carousel";
import CardNovel from "@/components/cardNovel";
import GooeyNav from "@/components/GooeyNav/GooeyNav";

// Các tab danh mục
const categoryTabs = [
  { label: "Tất cả", href: "#all" },
  { label: "Tiên Hiệp", href: "#tienhiep" },
  { label: "Kiếm Hiệp", href: "#kiemhiep" },
  { label: "Ngôn Tình", href: "#ngontinh" },
  { label: "Đô Thị", href: "#dothi" },
  { label: "Huyền Ảo", href: "#huyenao" },
];

// Các tab xếp hạng
const rankingTabs = [
  { label: "Đọc nhiều", href: "#docnhieu" },
  { label: "Đề cử", href: "#decu" },
  { label: "Yêu thích", href: "#yeuthich" },
  { label: "Mới cập nhật", href: "#moicapnhat" },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeRanking, setActiveRanking] = useState(0);

  return (
    <div className="w-full flex flex-col items-center">
      <section className="w-full max-w-[1300px] py-8 px-4">
        <Banner_carousel />
      </section>

      {/* Section Danh mục với GooeyNav */}
      <section className="w-full max-w-[1300px] px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold">Truyện mới nhất nef</h2>

          <GooeyNav
            items={categoryTabs}
            animationTime={600}
            particleCount={15}
            particleDistances={[90, 10]}
            particleR={100}
            timeVariance={300}
            colors={[1, 2, 3]}
            initialActiveIndex={activeCategory}
          />

        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
        </div>
      </section>

      {/* Section Xếp hạng với GooeyNav */}
      <section className="w-full max-w-[1300px] px-4 py-12 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold">Bảng xếp hạng</h2>

          <GooeyNav
            items={rankingTabs}
            animationTime={500}
            particleCount={20}
            particleDistances={[80, 15]}
            particleR={80}
            timeVariance={250}
            colors={[2, 3, 4, 2, 3, 4, 2, 1]}
            initialActiveIndex={activeRanking}
          />

        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
        </div>
      </section>

      {/* Section Thể loại hot */}
      <section className="w-full max-w-[1300px] px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold">Thể loại hot</h2>

          <GooeyNav
            items={[
              { label: "Hành động", href: "#hanhdong" },
              { label: "Lãng mạn", href: "#langman" },
              { label: "Phiêu lưu", href: "#phieuluu" },
              { label: "Hài hước", href: "#haihuoc" },
              { label: "Kinh dị", href: "#kinhdi" },
            ]}
            animationTime={550}
            particleCount={18}
            particleDistances={[85, 12]}
            particleR={90}
            timeVariance={280}
            colors={[3, 1, 4, 3, 1, 4, 3, 2]}
            initialActiveIndex={0}
          />

        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
          <CardNovel coverImage="/ANIMENETFLIX-FA.webp" title="Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị" genres={
            [{ name: "Huyền huyễn", url: "/" },
            { name: "Tu tiên", url: "/" },
            { name: "Tiên hiệp", url: "/" }]
          } />
        </div>
      </section>
    </div>
  );
}
