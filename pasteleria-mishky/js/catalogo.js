// Pastelería Mishky - Catálogo dinámico
const RUTA_DATOS = "data/productos.json";
const TODAS = "Todas";

// Referencias al DOM
const contFiltros = document.querySelector("#filtros");
const grilla = document.querySelector("#grilla");
const estado = document.querySelector("#estado");
const plantilla = document.querySelector("#tpl-producto");
const inputBuscador = document.querySelector("#buscador");
const btnTema = document.querySelector("#btn-tema");

// Estado de la aplicación
let productos = [];
let categoriaActiva = TODAS;
let textoBusqueda = "";

// Formato de moneda peruana (S/ 89.90)
const soles = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

// 1. Cargar los datos desde el archivo JSON
async function cargarProductos() {
    const respuesta = await fetch(RUTA_DATOS);
    if (!respuesta.ok) {
        throw new Error(`No se pudo leer ${RUTA_DATOS} (HTTP ${respuesta.status})`);
    }
    const datos = await respuesta.json();
    if (!Array.isArray(datos)) {
        throw new Error("El archivo JSON debe contener un arreglo de productos");
    }
    return datos;
}

// 2. Generar los botones de filtro
function obtenerCategorias(lista) {
    return [TODAS, ...new Set(lista.map((p) => p.categoria))];
}

function renderizarFiltros(categorias) {
    const fragmento = document.createDocumentFragment();
    categorias.forEach((cat) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "filtro";
        boton.dataset.categoria = cat;
        const total = cat === TODAS ? productos.length : productos.filter((p) => p.categoria === cat).length;
        boton.textContent = `${cat} (${total})`;
        boton.setAttribute("aria-pressed", String(cat === categoriaActiva));
        fragmento.append(boton);
    });
    contFiltros.replaceChildren(fragmento);
}

// 3. Crear una tarjeta a partir de un producto
function crearTarjeta(p) {
    const nodo = plantilla.content.cloneNode(true);
    const tarjeta = nodo.querySelector(".tarjeta");
    const img = nodo.querySelector("img");
    const etiqueta = nodo.querySelector(".etiqueta");

    img.src = p.imagen;
    img.alt = p.nombre;
    img.onerror = () => {
        img.onerror = null;
        img.src = "img/sin-imagen.jpg";
    };

    nodo.querySelector(".tarjeta_categoria").textContent = p.categoria;
    nodo.querySelector(".tarjeta_nombre").textContent = p.nombre;
    nodo.querySelector(".tarjeta_descripcion").textContent = p.descripcion;
    nodo.querySelector(".tarjeta_precio").textContent = soles.format(p.precio);
    nodo.querySelector(".tarjeta_porciones").textContent = p.porciones > 1 ? `${p.porciones} porciones` : "1 unidad";

    if (p.stock === 0) {
        etiqueta.textContent = "Agotado";
        etiqueta.classList.add("etiqueta--agotado");
        etiqueta.hidden = false;
        tarjeta.classList.add("tarjeta--agotado");
    } else if (p.destacado) {
        etiqueta.textContent = "Favorito";
        etiqueta.hidden = false;
    }

    return nodo;
}

// 4. Renderizar la lista filtrada por categoría y búsqueda
function renderizarCatalogo() {
    const termino = textoBusqueda.trim().toLowerCase();

    const lista = productos.filter((p) => {
        const coincideCategoria = categoriaActiva === TODAS || p.categoria === categoriaActiva;
        const coincideTexto =
            p.nombre.toLowerCase().includes(termino) ||
            p.descripcion.toLowerCase().includes(termino);

        return coincideCategoria && coincideTexto;
    });

    if (lista.length === 0) {
        grilla.replaceChildren();
        estado.textContent = termino ?
            `No se encontraron productos que coincidan con «${textoBusqueda.trim()}».` :
            "No hay productos en esta categoría.";
        return;
    }

    const fragmento = document.createDocumentFragment();
    lista.forEach((p) => fragmento.append(crearTarjeta(p)));
    grilla.replaceChildren(fragmento);

    const texto = categoriaActiva === TODAS ? "en total" : `en «${categoriaActiva}»`;
    estado.textContent = `Mostrando ${lista.length} productos ${texto}.`;
}

// 5. Delegación de eventos en el contenedor de filtros
contFiltros.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".filtro");
    if (!boton || boton.dataset.categoria === categoriaActiva) return;

    categoriaActiva = boton.dataset.categoria;
    contFiltros.querySelectorAll(".filtro").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === boton));
    });
    renderizarCatalogo();
});

// 6. Eventos de los nuevos retos (buscador y tema oscuro)
inputBuscador.addEventListener("input", (evento) => {
    textoBusqueda = evento.target.value;
    renderizarCatalogo();
});

btnTema.addEventListener("click", () => {
    const oscuroActivo = document.body.classList.toggle("tema-oscuro");
    btnTema.setAttribute("aria-pressed", String(oscuroActivo));
    btnTema.textContent = oscuroActivo ? "☀️ Modo claro" : "🌙 Modo oscuro";
});

// 7. Inicio de la aplicación
async function iniciar() {
    estado.textContent = "Cargando productos...";
    try {
        productos = await cargarProductos();
        renderizarFiltros(obtenerCategorias(productos));
        renderizarCatalogo();
    } catch (error) {
        console.error(error);
        estado.textContent = "No se pudo cargar el catálogo. Verifique que abrió la página con Live Server.";
        estado.classList.add("estado--error");
    } finally {
        grilla.setAttribute("aria-busy", "false");
    }
}

iniciar();