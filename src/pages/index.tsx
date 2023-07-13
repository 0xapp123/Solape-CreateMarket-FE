import Link from '@/components/Link'

export default function HomePage() {
  return (
    <div>
      <nav className="select-none text-white px-12 py-4 mobile:p-0 transition-all bg-[#161a1a] grid-area-a">
        <div className="flex items-center justify-between Row mobile:h-14 mobile:bg-cyberpunk-card-bg">
          <div className="flex items-center Row">
            <span className="Link clickable text-[#39D0D8] hover:underline underline-offset-1">
              <img className="cursor-pointer Image mobile:hidden" src="/logo/logo.svg" alt="logo" />
            </span>
          </div>
          <div className="flex items-center gap-8 Row mobile:hidden">
            <div className="">
              <Link href="/create-market/" className="ml-6 text-white">
                Create market
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div></div>
    </div>
  )
}
