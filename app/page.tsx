"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

type Data = {
  visits: number;
  lastVisit: string;
};

export default function Home() {
  const [data, setData] = useState<Data>({ visits: 0, lastVisit: "" });
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/visits")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="relative flex place-items-center">
        <Image
          className="relative"
          src="/landbot.png"
          alt="Landbot Logo"
          width={180}
          height={37}
          priority
        />
      </div>

      <div className="flex flex-col items-center mt-20">
        <h1 className="text-4xl font-bold text-center">
          Welcome to the Landbot SRE Challenge!
        </h1>

        {isLoading && <p>Loading...</p>}
        {data && (
          <>
            <p className="mt-10">
              You are today&apos;s visitor number{" "}
              <span className="font-bold">{data.visits}</span> .
            </p>
            <p className="mt-10">
              Last Visit was at{" "}
              <span className="font-bold">{data.lastVisit}</span> .
            </p>
          </>
        )}
      </div>
    </main>
  );
}
