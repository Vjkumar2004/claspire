export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <div
        className="hidden lg:block lg:w-1/2"
        style={{
          backgroundImage: "url('/login-signup.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-10 overflow-y-auto bg-[#FAFAFA] dark:bg-[#1D2226]">
        <div className="w-full max-w-[420px] py-8">
          {children}
        </div>
      </div>
    </div>
  )
}
