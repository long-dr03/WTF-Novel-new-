import { Banner_carousel } from "@/components/carousel";
import CardNovel from "@/components/cardNovel";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center">
      <section className="w-full max-w-[1300px] py-8 px-4">
        <Banner_carousel />
      </section>

      <section className="w-full max-w-[1300px] px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Truyện mới nhất</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <CardNovel />
          <CardNovel />
          <CardNovel />
          <CardNovel />
          <CardNovel />
          <CardNovel />
          <CardNovel />
          <CardNovel />
        </div>
      </section>
    </div>
  );
}
