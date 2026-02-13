/*
 * DESIGN: Precision Studio — Portfolio Page
 * Neurodesign: Social proof, before/after contrast
 * Sections: Hero → Filter → Project Grid → CTA
 */

import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const HERO_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/161FV9HPbAyEn7ahlYrN3P/sandbox/KL1Qk4lWhh3ZsCSl1gJNhr-img-1_1771024311000_na1fn_aGVyby1vZmZpY2UtaW50ZXJpb3I.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMTYxRlY5SFBiQXlFbjdhaGxZck4zUC9zYW5kYm94L0tMMVFrNGxXaGgzWnNDU2wxZ0pOaHItaW1nLTFfMTc3MTAyNDMxMTAwMF9uYTFmbl9hR1Z5YnkxdlptWnBZMlV0YVc1MFpYSnBiM0kuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=GgN2m0QV2KvzTex1sXICLb6RNf0xGNX0YnSxuPWw4AzIQEk7YMDBi-8bNW1ZMSd9pdiVcgwXXLoasbF3LMPR8UyDPif3D4loVkP7mivJDOi~T7OWU0pJReMxNiWQwSbrl39x6gDMNFq523Vhc6tUI8J2fcF4gBzUjSkpbrZ0EO4W8fyXCG2NlfSemNRYEJdQAuCW93jAlH2sgRTILZHJBz6MMCCgUaNzFUOGegcPdkg3aQOP9D9kGRsLonQZhnWz~0MAqwJmP-De-bOppnb7HtFKYfbGo~8GrSo7kdIZVNQfxOQYAiDDKRMB-1XYQOG-yKz5tRdjjpreCYookrK1VA__";

const PORTFOLIO_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/161FV9HPbAyEn7ahlYrN3P/sandbox/KL1Qk4lWhh3ZsCSl1gJNhr-img-2_1771024308000_na1fn_cG9ydGZvbGlvLXNob3djYXNl.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMTYxRlY5SFBiQXlFbjdhaGxZck4zUC9zYW5kYm94L0tMMVFrNGxXaGgzWnNDU2wxZ0pOaHItaW1nLTJfMTc3MTAyNDMwODAwMF9uYTFmbl9jRzl5ZEdadmJHbHZMWE5vYjNkallYTmwuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Hw7einNZG8VtHtD8tPZ9ztgy1QU7GFk961BMO1As0a8Fphw0GHkT0iQAos0dQaD6gkHZydMMYMkN2k-HrVPBag1j7GCqNbqtvaNNnYGg~LNg4~qF~Cen8m5cctRlt1kq0yiDEUb27GcXyp4ldxCib79IZWgjFM-0llG~B-hNiE0DRPRfy81YARTdmTM0ow~KO5JFWxp7lADn~KIIQbp-~2Qxg2W~spn7fP1o-ihLOgptKCzX8IaL4wSK1dITc~gzUJsZTYdEaQKJ7eo2PoMFK704g5Z7WCln1M-Jf82s~3zCzrllalKYEwcgUvcqaA9yrCW2cvoroP2rdlY2aUaOaA__";

const SOLUTION_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/161FV9HPbAyEn7ahlYrN3P/sandbox/KL1Qk4lWhh3ZsCSl1gJNhr-img-3_1771024313000_na1fn_c29sdXRpb24td29ya3NwYWNl.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMTYxRlY5SFBiQXlFbjdhaGxZck4zUC9zYW5kYm94L0tMMVFrNGxXaGgzWnNDU2wxZ0pOaHItaW1nLTNfMTc3MTAyNDMxMzAwMF9uYTFmbl9jMjlzZFhScGIyNHRkMjl5YTNOd1lXTmwuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Rx7X6a~EBZOVIZ-32mIA3qkLD5Ab0cNCVJpuYy3n3Za9IW~W8Yo-Q6UgE9ejzzF5Gi2nON0cX~HwOhfRTAONKz33JKo~1Wm~E9g9o28Kfqb6oRWtgOS2RfJw7T7F-4sFj24Jo3bblhJk1Iez2n-luFpiWN1HYwlcInppyULy2dh~Vn49~o08qcn4M5Yjx4goz4vQ~IeawZJdRQGv7chSBZ5CQUD2pMPtw13VKjJ1ZhAzaZuuPfnjnPEYgLuU6z0NSztegWLAkEsjdGB5GWOC7XXpquAd78n~jn0gRpTa0IFLFOscvvLB0lxckmueOyxgnhjL75TCMTBHfaVO2Q9r9A__";

const ABOUT_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/161FV9HPbAyEn7ahlYrN3P/sandbox/KL1Qk4lWhh3ZsCSl1gJNhr-img-4_1771024316000_na1fn_YWJvdXQtdGVhbS1zcGFjZQ.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMTYxRlY5SFBiQXlFbjdhaGxZck4zUC9zYW5kYm94L0tMMVFrNGxXaGgzWnNDU2wxZ0pOaHItaW1nLTRfMTc3MTAyNDMxNjAwMF9uYTFmbl9ZV0p2ZFhRdGRHVmhiUzF6Y0dGalpRLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=qUIhZfhYgmiLM1M5h1mSByW0m-Wfjw-ZEhwVObCDNRIsq~RJ5GAQETlugFDuUOKHVqxT6CFZu7L4CsVyCRGp5MANoroEziRkqVPlbBj83-1W-AJEOHx0takuEs50c5kYX6WdrSvt4oWd78AfVfrTUPoe5Z7qpTZwrCQvEC88o6Azq52EtwWlMn6ZM3-6Mg5GXIOPE1PqlZIZSgv9RkGggZfruyQ5EPWiUyqJGm1CyhLIF~MvR3T88mZ5EucYUstOKlwroEcc-PsgR1~qzpNFEanUrteWqIDMOFoYQndjMs8gE~8yFiWz2dPktO4vuKxcDCA15UyCiQeDfkvSjRfmrg__";

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const CATEGORIES = ["전체", "사무실", "상업공간", "리모델링"];

const PROJECTS = [
  { title: "승일일렉트로닉스 본사", category: "사무실", area: "330㎡", year: "2025", image: HERO_IMG, client: "승일일렉트로닉스" },
  { title: "LAB543 크리에이티브 스튜디오", category: "상업공간", area: "200㎡", year: "2024", image: PORTFOLIO_IMG, client: "LAB543" },
  { title: "허시드 오피스", category: "사무실", area: "450㎡", year: "2024", image: SOLUTION_IMG, client: "허시드" },
  { title: "필립스코리아 서울 오피스", category: "리모델링", area: "800㎡", year: "2023", image: ABOUT_IMG, client: "필립스" },
  { title: "APEC 컨퍼런스 센터", category: "상업공간", area: "1,200㎡", year: "2023", image: HERO_IMG, client: "APEC" },
  { title: "엠아이티소프트 R&D센터", category: "사무실", area: "600㎡", year: "2022", image: PORTFOLIO_IMG, client: "엠아이티소프트" },
];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("전체");

  const filtered = activeCategory === "전체"
    ? PROJECTS
    : PROJECTS.filter((p) => p.category === activeCategory);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-12 lg:pb-16">
        <div className="container">
          <FadeUp>
            <p className="text-xs font-medium tracking-widest uppercase text-gold mb-6">
              Projects
            </p>
            <h1 className="font-heading text-4xl lg:text-6xl font-bold text-ink leading-tight mb-8 max-w-3xl">
              150건 이상의
              <br />프로젝트가 증명합니다
            </h1>
          </FadeUp>
        </div>
      </section>

      {/* Filter */}
      <section className="pb-12">
        <div className="container">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-ink text-white"
                    : "bg-paper-warm text-ink/60 hover:text-ink"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Project Grid */}
      <section className="pb-20 lg:pb-28">
        <div className="container">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {filtered.map((project, i) => (
                <FadeUp key={project.title} delay={i * 0.1}>
                  <div className="group relative overflow-hidden aspect-[4/3] cursor-pointer">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-2 py-0.5 text-xs font-medium bg-gold/20 text-gold border border-gold/30">
                          {project.category}
                        </span>
                        <span className="text-xs text-white/50">{project.area}</span>
                        <span className="text-xs text-white/50">{project.year}</span>
                      </div>
                      <h3 className="font-heading text-xl lg:text-2xl font-bold text-white group-hover:text-gold transition-colors duration-500">
                        {project.title}
                      </h3>
                      <p className="text-sm text-white/40 mt-1">{project.client}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-paper-warm">
        <div className="container text-center">
          <FadeUp>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-ink mb-6">
              다음 프로젝트의 주인공이 되세요
            </h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto">
              귀사의 공간도 이렇게 변화시킬 수 있습니다.
            </p>
            <Link href="/contact">
              <span className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300">
                프로젝트 문의하기
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
