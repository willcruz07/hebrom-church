import { Hero } from '@/components/landing/Hero'
import { ChurchSection } from '@/components/landing/ChurchSection'
import { CultSchedule } from '@/components/landing/CultSchedule'
import { Users, Heart, Music, Book, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-slate-200 selection:bg-amber-500/30 selection:text-amber-500">
      <main>
        {/* Impact Hero */}
        <Hero />

        {/* Nossos Cultos */}
        <ChurchSection
          id="cultos"
          title="Nossos Cultos"
          subtitle="Venha celebrar e crescer conosco em comunhão e adoração."
        >
          <CultSchedule />
        </ChurchSection>

        {/* Ministérios */}
        <ChurchSection
          id="ministerios"
          className="bg-slate-900/30"
          title="Departamentos"
          subtitle="Cada membro um ministério, cada vida uma oportunidade de servir."
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Juventude', icon: Users, color: 'bg-amber-500' },
              { title: 'Louvor', icon: Music, color: 'bg-purple-500' },
              { title: 'Infantil', icon: Heart, color: 'bg-red-500' },
              { title: 'Ensino', icon: Book, color: 'bg-emerald-500' },
            ].map((min, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl bg-slate-900 p-8 border border-slate-800 transition-all hover:bg-slate-800"
              >
                <div
                  className={`${min.color} mb-4 inline-flex rounded-xl p-3 text-white transition-transform group-hover:scale-110`}
                >
                  <min.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{min.title}</h3>
                <p className="text-sm text-slate-400">
                  Atividades dinâmicas e focadas no crescimento espiritual de cada grupo.
                </p>
              </div>
            ))}
          </div>
        </ChurchSection>

        {/* Comunidade / Galeria */}
        <ChurchSection
          id="comunidade"
          title="Nossa Comunidade"
          subtitle="A Hebrom é mais do que um lugar, é uma família unida pelo propósito."
        >
          <div className="relative rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-3xl aspect-[16/9] lg:aspect-[21/9]">
            <img
              src="/community.png"
              alt="Comunidade Hebrom"
              className="h-full w-full object-cover transition-transform duration-[3s] hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent flex items-center p-12">
              <div className="max-w-md">
                <h3 className="text-3xl font-bold text-white mb-4">Vibrante & Ativa</h3>
                <p className="text-slate-300 leading-relaxed mb-6">
                  De crianças a idosos, todos encontram seu lugar em nossa comunidade. Participamos
                  juntos de momentos que transformam vidas.
                </p>
                <div className="flex gap-4">
                  <div className="h-12 w-1 bg-amber-500" />
                  <p className="text-sm font-medium text-slate-400 italic">
                    Pois onde dois ou três estiverem reunidos em meu nome, ali eu estou no meio
                    deles. - Mateus 18:20
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ChurchSection>

        <ChurchSection
          id="lideranca"
          title="Nossos Pastores"
          subtitle="Liderança dedicada a pastorear com amor, verdade e integridade."
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            {[
              {
                name: 'Marcos Antonio Xavier',
                role: 'Pastor Presidente',
                img: '/pastor_marcos.png',
              },
              { name: 'Gisele da Conceição', role: 'Pastora', img: '/pastora_gisele.jpg' },
            ].map((pastor, i) => (
              <div key={i} className="text-center group">
                <div className="mb-6 h-48 w-48 rounded-full border-4 border-slate-800 bg-slate-900 overflow-hidden mx-auto transition-all group-hover:border-amber-500/50 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                    {/* <Users size={64} className="text-slate-700" /> */}
                    <Image
                      src={pastor.img}
                      alt={pastor.name}
                      width={192}
                      height={192}
                      className="h-full w-full object-cover transition-transform duration-[3s] hover:scale-105"
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-amber-500 transition-colors">
                  {pastor.name}
                </h3>
                <p className="text-amber-500 font-medium uppercase tracking-wider text-xs">
                  {pastor.role}
                </p>
              </div>
            ))}
          </div>
        </ChurchSection>

        {/* Localização e Imagem */}
        <ChurchSection
          id="localizacao"
          className="bg-slate-900/30"
          title="Onde Estamos"
          subtitle="Faça-nos uma visita. Ficaremos muito felizes em recebê-lo."
        >
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="rounded-2xl bg-amber-500/10 p-4 text-amber-500">
                  <MapPin size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Endereço</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Rua Fileuterpe - N•830
                    <br />
                    Teresópolis - RJ, São Pedro
                  </p>
                  <a
                    href="https://maps.app.goo.gl/Zy4ib5G82RrNnTdv8"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 text-amber-500 font-semibold hover:underline flex items-center gap-2"
                  >
                    Ver no Google Maps →
                  </a>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="rounded-2xl bg-amber-500/10 p-4 text-amber-500">
                  <Phone size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Contato</h4>
                  <p className="text-slate-400">contato@hebromchurch.com.br</p>
                  <p className="text-slate-400">(21) 96940-9753</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <a
                  href="https://www.instagram.com/hebromchurch?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-amber-500 hover:text-white transition-all"
                >
                  <Image
                    src="/instagram.png"
                    alt="Instagram"
                    width={128}
                    height={128}
                    className="h-full w-full object-cover transition-transform duration-[3s] hover:scale-105"
                  />
                </a>
                <a
                  href="https://www.youtube.com/@HEBROMCHURCHTERESOPOLIS/streams"
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-amber-600 hover:text-white transition-all"
                >
                  <Image
                    src="/youtube.png"
                    alt="Youtube"
                    width={128}
                    height={128}
                    className="h-full w-full object-cover transition-transform duration-[3s] hover:scale-105"
                  />
                </a>
                <a
                  href="https://wa.me/5521969409753?text=Ola%20Hebrom"
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-red-600 hover:text-white transition-all"
                >
                  <Image
                    src="/whatsapp.png"
                    alt="Whatsapp"
                    width={128}
                    height={128}
                    className="h-full w-full object-cover transition-transform duration-[3s] hover:scale-105"
                  />
                </a>
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-slate-800 aspect-video lg:aspect-square shadow-2xl">
              <img
                src="/church_exterior.png"
                alt="Hebrom Church Exterior"
                className="h-full w-full object-cover grayscale-[0.2] contrast-125 transition-transform duration-1000 hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            </div>
          </div>
        </ChurchSection>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-16 px-6">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start">
              <Image
                width={400}
                height={400}
                src="/logo_sb.png"
                alt="Hebrom Church"
                className="h-auto w-40 mb-4 object-contain brightness-125"
              />
              <p className="text-slate-500 text-sm max-w-xs text-center md:text-left">
                Hebrom Church - Uma igreja apaixonada por Deus e por pessoas.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm font-medium text-slate-400">
              <Link href="#cultos" className="hover:text-amber-500 transition-colors">
                Cultos
              </Link>
              <Link href="#ministerios" className="hover:text-amber-500 transition-colors">
                Ministérios
              </Link>
              <Link href="#lideranca" className="hover:text-amber-500 transition-colors">
                Liderança
              </Link>
              <Link href="#localizacao" className="hover:text-amber-500 transition-colors">
                Localização
              </Link>
            </div>

            <div className="text-center md:text-right">
              <p className="text-slate-500 text-xs mb-2">© {new Date().getFullYear()} Hebrom Sys</p>
              <p className="text-slate-600 text-[10px] uppercase tracking-widest">
                Conectando nossa comunidade
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
