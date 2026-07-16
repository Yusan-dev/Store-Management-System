### lihat agent.md dulu
sekarang kita buat dashboard baru namanya Broken Size dan IL
task 1
### Broken size adalah menghitung jumlah size dalam 1 artikel untuk apparel dikaatakan broken size adalah jika dalam satu artikel ada <=2, jika footwear <=3. Data yang diupload adalah file stockpositionreportdetail.xls berarti logikanya sama seperti auto stock. kita misalkan
NEW ERA(1)	APPAREL(2)	SPORTS LIFESTYLE APPAREL(3)	TSHIRT SHORT SLEEVE(4)	NRA14500107GRE00M / NRA OS SSTEE NBA FLAME LOSLAK (, GREY, M(5)	198582177958(6)	499.500(7)	1(8)	499.500(9)
NEW ERA	APPAREL	SPORTS LIFESTYLE APPAREL	TSHIRT SHORT SLEEVE	NRA14500107GRE0XL / NRA OS SSTEE NBA FLAME LOSLAK, GREY, XL	198582177972	499.500	6	2.997.000
NEW ERA	APPAREL	SPORTS LIFESTYLE APPAREL	TSHIRT SHORT SLEEVE	NRA145001090050XL / NRA OS SSTEE NBA FLAME CHIBUL, BLACK, XL	198582178115	499.500	1	499.500
NEW ERA	APPAREL	SPORTS LIFESTYLE APPAREL	TSHIRT SHORT SLEEVE	NRA145001100050XL / NRA OS SSTEE NBA FLAME BOSCEL, BLACK, XL	198582178184	499.500	1	499.500
NEW ERA	APPAREL	SPORTS LIFESTYLE APPAREL	TSHIRT SHORT SLEEVE	NRA14500154GRE00M / NRA OS SSTEE BASKETBALL CHIBUL, GREY, M	198582181245	449.700	1	449.700
NEW ERA	APPAREL	SPORTS LIFESTYLE APPAREL	TSHIRT SHORT SLEEVE	NRA1450016312W00L / NRA SSTEE 5950PK FLINF NEYYAN (, BLUE, L	198582181863	1.199.000	2	2.398.000
NEW ERA	APPAREL	SPORTS LIFESTYLE APPAREL	TSHIRT SHORT SLEEVE	NRA1450016312W00S / NRA SSTEE 5950PK FLINF NEYYAN (, BLUE, S	198582181887	1.199.000	2	2.398.000
NEW ERA	APPAREL	SPORTS LIFESTYLE APPAREL	TSHIRT SHORT SLEEVE	NRA1450016312W0XL / NRA SSTEE 5950PK FLINF NEYYAN, BLUE, XL	198582181894	1.199.000	2	2.398.000
NEW ERA	APPAREL	SPORTS LIFESTYLE APPAREL	TSHIRT SHORT SLEEVE	NRA1450016312WXXL / NRA SSTEE 5950PK FLINF NEYYAN, BLUE, XXL	198582181917	1.199.000	1	1.199.000
berarti ambil di kolom 2 untuk kategorinya untuk artikelnya ambil dikolom jadi sebelum tanda "/" adalah artikelnya misal NRA14500107GRE00M / NRA OS SSTEE NBA FLAME LOSLAK (, GREY, M jadi artikelnya NRA14500107GRE00M, ambil sebelas karakter saja jadi kiri NRA14500107, untuk sizenya NRA14500107GRE00M adalah angka terakhir sebelum angka jadi sizenya M. jadi cari artikelnya jika apakah sizenya <=2 untuk apparel dan <=3 untuk footwear hitung jumlah artikelnya yang broken size dan tidak broken size dalam banyak dan persentasenya. ini mirip auto stok nanti kamu tampilkan semua artikelnya broken size atau tidak broken size dan summarynya ini versi auto stock tapi upgrade
### task 2
IL adalah menghitung rata-rata penjualan selama 3 bulan file yang diupload adalah file merchandise sales report selama 3 bulan dengan stock yang ada misal, apparel rata-penjualan 390 stock apparel sekarang 1000 maka 1000/390. logikanya bisa pakai extraxt merchandise sales report.
### untuk kedua task diatas saling berhubungan saya harap anda paham