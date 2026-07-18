document.getElementById("print").onclick = printPDF;

function printPDF() {
  const rows = window.filteredData || [];

  if (!rows.length) {
    alert("No data");

    return;
  }

  let html = `

<html>

<head>

<title>

SMS AUTO STOCK

</title>

<style>

body{

font-family:

Arial;

padding:

30px;

}



.header{

display:flex;

justify-content:

space-between;

border-bottom:

2px solid black;

padding-bottom:

20px;

margin-bottom:

20px;

}



.title{

font-size:

26px;

font-weight:

900;

}



.summary{

display:flex;

gap:

20px;

margin-bottom:

20px;

}



table{

width:100%;

border-collapse:

collapse;

}



th{

background:

black;

color:

white;

}



th,
td{

padding:

10px;

border:

1px solid #ddd;

}



.footer{

margin-top:

30px;

text-align:

center;

color:

gray;

}



</style>

</head>

<body>



<div
class="header">

<div>

<div
class="title">

SMS AUTO STOCK

</div>

<div>

Generated:
${new Date().toLocaleString()}

</div>

</div>



<div>

SKU:

${rows.length}

<br>

QTY:

${rows.reduce((a, b) => a + b.qty, 0)}

</div>

</div>





<table>

<thead>

<tr>

<th>

ARTIKEL

</th>

<th>

DESCRIPTION

</th>

<th>

PRICE

</th>

<th>

STATUS

</th>

<th>

QTY

</th>

</tr>

</thead>

<tbody>

`;

  rows.forEach((r) => {
    html += `

<tr>

<td>

${r.artikel}

</td>

<td>

${r.desc}

</td>

<td>

${Number(r.price).toLocaleString()}

</td>

<td>

${r.status}

</td>

<td>

${r.qty}

</td>

</tr>

`;
  });

  html += `

</tbody>

</table>



<div
class="footer">

KANGODING.ORG © 2026

</div>



</body>

</html>

`;

  const win = window.open("", "_blank");

  win.document.write(html);

  win.document.close();

  setTimeout(
    () => {
      win.print();
    },

    400,
  );
}


