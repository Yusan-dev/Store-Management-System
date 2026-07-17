### new task lihat selalu agent.md
======task1=========
## buat dashboard baru dengan nama Change Price
--- logika yaitu membandingkan artikel yang ada di stock store dalam hal ini ambil logika dari dashbord auto stock dengan artikel dari file B yaitu file PL Sport Golf Fashion Footwear dan Footwear Xpress cocok kedua artikel kalau cocok maka tampilkan harga dikolom B dan gunakan logika untuk menghitung % diskonnya dari harga tersebut ambil logika dari auto stock.
--- case dalam artikel auto stock 
kolom
1       2   3                                                                   4       5   6   7
ADIDAS GOLF	ACCESSORIES	ADFIN27	M / ADF25FW ARM SLEEVES LO, WHITE, SMALL/MED	275.400	40%	MEN	2
--- dalam file pl sport golf
kolom
1   2       3                   4       5
SBU	Brand	Generic Article	Description	 Price 
GOLF	ADO	ADOJF4903	ADO25SS POL ULT365 TEXTURED  (M) WHT	 400.000 
GOLF	PUG	PUG024518-01	PUG25SS CAP PALMER P  (M) WHT	 150.000 
GOLF	PUG	PUG628862-02	PUG25SS AOW YOUV 1/4 ZIP (M) NVY	 500.000 
GOLF	ADO	ADOJY1915	ADO25FW POL ULT365 ELEVATED TWST (M) GRN	 649.500 
GOLF	ADO	ADOJF4865	ADO25SS PAN BTC JOGGER  (M) NAV	 400.000 

terdapat 5 kolom di file B, jadi bandingkan artikel a dan artikel b kalau cocok cari harganya dikolom ke 5 file, caari untuk setiap artikel di file A. di file B ada 4 sheet dalam 1 file jadi kamu harus cari disheet hingga sheet ke n, kalau ada tampilkan true(hijau) kalu tidak ada tampilkan false(merah). jadi file b menjadi
koom
                                                                               
                                                                                status       price new price            discout         new discount                stock
ADIDAS GOLF	ACCESSORIES	ADFIN27	M / ADF25FW ARM SLEEVES LO, WHITE, SMALL/MED	true/false 275.400  harga dari file B     dari fileA      dari file B seseuai logika dari auto stock   

file yang di upload stock position report dan PL Sport Golf Fashion Footwear dan Footwear Xpress untuk logika proese bisa simpan dilokal samkan saja dan menurut kamu untuk ui/ux nya bagaiman