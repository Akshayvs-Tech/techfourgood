"use client";
import BackgroundSlider from "./component/BackgroundSlider";
import LiveScoreTable from "./component/LivescoreTable";
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation';
import RegisterPage from "./public/register/page";

export default function HomePage() {
    const router = useRouter();

  const handleClick = () => {
    router.push('/admin/setup/tournament-details'); // navigates to another page
  };
  return (
    <div>
      {/* Background Slider Section */}
      <BackgroundSlider />
      
      {/* Live Score Table Section - appears when scrolling down */}
      <div className="w-full bg-gradient-to-b from-gray-900 to-black py-16">
        <LiveScoreTable />
        <div className="flex container mx-auto justify-center items-center p-5">
          <p className="text-white font-medium text-2xl ">Build Your League , Make New Champions .</p>
            <Button variant="link"
            onClick={handleClick}
            className="text-white font-extrabold justify-center text-base items-center pt-3">Create New Tournament</Button>
        </div>
      </div>
      <RegisterPage />
    </div>
  );
}
