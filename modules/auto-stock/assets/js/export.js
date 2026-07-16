document

.getElementById(
"export"
)

.onclick=

exportFiltered





function exportFiltered(){



const rows=

window.filteredData

||

[]



if(

!rows.length

){

alert(

"Tidak ada data"

)

return

}





const exportRows=

rows.map(

x=>({

BRAND:
x.brand,

CATEGORY:
x.category,

ARTIKEL:
x.artikel,

DESCRIPTION:
x.desc,

PRICE:
x.price,

STATUS:
x.status,

GENDER:
x.gender,

QTY:
x.qty

})

)





const ws=

XLSX

.utils

.json_to_sheet(

exportRows

)





const wb=

XLSX

.utils

.book_new()



XLSX

.utils

.book_append_sheet(

wb,

ws,

"GT AUTO STOCK"

)





ws["!cols"]=[

{wch:18},

{wch:18},

{wch:18},

{wch:40},

{wch:14},

{wch:12},

{wch:14},

{wch:12}

]





const now=

new Date()



const stamp=

`${now.getFullYear()}-${
String(
now.getMonth()+1
)
.padStart(
2,
0
)
}-${
String(
now.getDate()
)
.padStart(
2,
0
)
}`





XLSX.writeFile(

wb,

`GT_AUTO_STOCK_${stamp}.xlsx`

)



}