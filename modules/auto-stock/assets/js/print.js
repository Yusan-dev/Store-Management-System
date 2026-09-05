document.getElementById("print").onclick = printPDF;

function printPDF() {
  const rows = window.filteredData || [];

  if (!rows.length) {
    alert("No data");

    return;
  }

  const cols =
    typeof gtGetVisibleColumnList === "function" &&
    gtGetVisibleColumnList().length
      ? gtGetVisibleColumnList()
      : [
          { key: "artikel", label: "ARTIKEL" },
          { key: "generic", label: "GENERIC ARTICLE" },
          { key: "variant", label: "VARIANT" },
          { key: "desc", label: "DESCRIPTION" },
          { key: "price", label: "PRICE" },
          { key: "status", label: "STATUS" },
          { key: "qty", label: "QTY" },
        ];

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

${cols.map((c) => `<th>${c.label}</th>`).join("")}

</tr>

</thead>

<tbody>

`;

  rows.forEach((r) => {
    html += `

<tr>

${cols
  .map((c) => {
    let v = r[c.key];

    if (v === undefined || v === null) v = "";

    if (c.key === "price" || c.key === "qty") {
      v = Number(v).toLocaleString("en-US");
    }

    return `<td>${v}</td>`;
  })
  .join("")}

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
