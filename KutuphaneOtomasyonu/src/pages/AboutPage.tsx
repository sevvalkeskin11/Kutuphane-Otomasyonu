import React from "react";

export function AboutPage() {
    return(
        <div className="flex flex-col  bg-gray-100">
            <div className="flex flex-col bg-gradient-to-br from-cyan-500 to-cyan-700 items-center justify-center">
                <br />
                <br />
                <h1 className="font-serif font-bold text-white text-3xl">Hakkımızda</h1>
                <br />
              <p className="text-white text-lg mt-4 px-20 mx-auto text-center font-serif">
              UniLib, üniversite öğrencileri için tasarlanmış bir kütüphane otomasyon sistemidir. <br />
                    Kullanıcı dostu arayüzü ve güçlü özellikleri ile kitapları kolayca bulabilir, <br />
                    kiralayabilir ve yönetebilirsiniz.
              </p> 
              <br />
              <br />
            </div>
<div className=" bg-gray-100 flex flex-col items-center justify-center">
    <br />
<h1 className="font-serif font-bold text-black text-3xl">Ekibimiz</h1>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-40 p-8">
             
               <div className="grid-span-1 bg-white p-6 rounded-lg shadow-md">
                <img className="size-64" src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" alt="" />
            <p className="text-center ">Tuğçe Çatak</p>
                </div>
                <div className="grid-span-2 bg-white p-6 rounded-lg shadow-md">
                <img className="size-64" src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" alt="" />
                <p className="text-center ">Şevval Keskin </p>
                </div>

                <div className="grid-span-3 bg-white p-6 rounded-lg shadow-md">
                <img className="size-64" src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" alt="" />
                <p className="text-center ">Nisa Nur Altunkaya</p>
                </div>

            </div>
</div>
            
        </div>
    )
}