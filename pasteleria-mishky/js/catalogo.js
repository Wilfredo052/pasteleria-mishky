// Pastelería Mishky - Catálogo dinámico (Versión 3: Ordenamiento y Carrito de Pedidos)
const RUTA_DATOS = "data/productos.json";
const TODAS = "Todas";

// Referencias al DOM
const contFiltros = document.querySelector("#filtros");
const selectOrdenar = document.querySelector("#ordenar");
const grilla = document.querySelector("#grilla");
const estado = document.querySelector("#estado");
const plantilla = document.querySelector("#tpl-producto");

// Referencias del carrito (Reto 4)
const btnCarrito = document.querySelector("#btn-carrito");
const contadorCarrito = document.querySelector("#contador-carrito");
const modalCarrito = document.querySelector("#modal-carrito");
const btnCerrarCarrito = document.querySelector("#btn-cerrar-carrito");
const listaCarrito = document.querySelector("#lista-carrito");
const textoCarritoVacio = document.querySelector("#carrito-vacio");
const mensajeConfirmacion = document.querySelector("#mensaje-confirmacion");
const totalCarrito = document.querySelector("#total-carrito");
const btnVaciar = document.querySelector("#btn-vaciar");
const btnConfirmar = document.querySelector("#btn-confirmar");

// Estado de la aplicación
let productos = [];
let categoriaActiva = TODAS;
let ordenActivo = "recomendado";
let carrito = [];

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
    const btnAgregar = nodo.querySelector(".btn-agregar");

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
        btnAgregar.textContent = "Agotado";
        btnAgregar.disabled = true;
    } else {
        if (p.destacado) {
            etiqueta.textContent = "Favorito";
            etiqueta.hidden = false;
        }
        btnAgregar.addEventListener("click", () => {
            agregarAlCarrito(p);
            btnAgregar.textContent = "✓ Agregado";
            setTimeout(() => {
                btnAgregar.textContent = "Agregar al pedido";
            }, 800);
        });
    }

    return nodo;
}

// 4. Ordenar y renderizar la lista filtrada (Reto 3)
function ordenarLista(lista) {
    const copia = [...lista];
    if (ordenActivo === "precio-asc") {
        return copia.sort((a, b) => a.precio - b.precio);
    }
    if (ordenActivo === "precio-desc") {
        return copia.sort((a, b) => b.precio - a.precio);
    }
    if (ordenActivo === "nombre-asc") {
        return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
    return copia;
}

function renderizarCatalogo() {
    const filtrados = categoriaActiva === TODAS ? productos : productos.filter((p) => p.categoria === categoriaActiva);
    const listaFinal = ordenarLista(filtrados);

    if (listaFinal.length === 0) {
        grilla.replaceChildren();
        estado.textContent = "No hay productos en esta categoría.";
        return;
    }

    const fragmento = document.createDocumentFragment();
    listaFinal.forEach((p) => fragmento.append(crearTarjeta(p)));
    grilla.replaceChildren(fragmento);

    const texto = categoriaActiva === TODAS ? "en total" : `en «${categoriaActiva}»`;
    estado.textContent = `Mostrando ${listaFinal.length} productos ${texto}.`;
}

// 5. Lógica del Carrito de Pedidos (Reto 4)
function agregarAlCarrito(producto) {
    mensajeConfirmacion.hidden = true;
    const existente = carrito.find((item) => item.nombre === producto.nombre);
    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1
        });
    }
    actualizarCarrito();
}

function cambiarCantidad(nombre, delta) {
    const indice = carrito.findIndex((item) => item.nombre === nombre);
    if (indice === -1) return;

    carrito[indice].cantidad += delta;
    if (carrito[indice].cantidad <= 0) {
        carrito.splice(indice, 1);
    }
    actualizarCarrito();
}

function actualizarCarrito() {
    const totalUnidades = carrito.reduce((suma, item) => suma + item.cantidad, 0);
    const montoTotal = carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);

    contadorCarrito.textContent = totalUnidades;
    totalCarrito.textContent = soles.format(montoTotal);

    const estaVacio = carrito.length === 0;
    textoCarritoVacio.hidden = !estaVacio;
    btnVaciar.disabled = estaVacio;
    btnConfirmar.disabled = estaVacio;

    listaCarrito.replaceChildren();
    carrito.forEach((item) => {
        const li = document.createElement("li");
        li.className = "carrito-item";
        li.innerHTML = `
            <div class="carrito-item-info">
                <strong>${item.nombre}</strong>
                <span>${soles.format(item.precio)} c/u · Subtotal: ${soles.format(item.precio * item.cantidad)}</span>
            </div>
            <div class="carrito-controles">
                <button type="button" class="btn-cant" aria-label="Quitar uno">-</button>
                <span>${item.cantidad}</span>
                <button type="button" class="btn-cant" aria-label="Agregar uno">+</button>
            </div>
        `;
        const [btnMenos, btnMas] = li.querySelectorAll(".btn-cant");
        btnMenos.addEventListener("click", () => cambiarCantidad(item.nombre, -1));
        btnMas.addEventListener("click", () => cambiarCantidad(item.nombre, 1));
        listaCarrito.append(li);
    });
}

function confirmarPedido() {
    if (carrito.length === 0) return;

    carrito = [];
    actualizarCarrito();

    textoCarritoVacio.hidden = true;
    mensajeConfirmacion.textContent = "✓ El pedido se ha enviado correctamente.";
    mensajeConfirmacion.hidden = false;
}

// 6. Eventos de interacción
contFiltros.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".filtro");
    if (!boton || boton.dataset.categoria === categoriaActiva) return;

    categoriaActiva = boton.dataset.categoria;
    contFiltros.querySelectorAll(".filtro").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === boton));
    });
    renderizarCatalogo();
});

selectOrdenar.addEventListener("change", (evento) => {
    ordenActivo = evento.target.value;
    renderizarCatalogo();
});

btnCarrito.addEventListener("click", () => {
    mensajeConfirmacion.hidden = true;
    textoCarritoVacio.hidden = carrito.length > 0;
    modalCarrito.showModal();
});

btnCerrarCarrito.addEventListener("click", () => modalCarrito.close());
modalCarrito.addEventListener("click", (evento) => {
    if (evento.target === modalCarrito) modalCarrito.close();
});

btnVaciar.addEventListener("click", () => {
    carrito = [];
    mensajeConfirmacion.hidden = true;
    actualizarCarrito();
});

btnConfirmar.addEventListener("click", confirmarPedido);

// 7. Inicio de la aplicación
async function iniciar() {
    estado.textContent = "Cargando productos...";
    try {
        productos = await cargarProductos();
        renderizarFiltros(obtenerCategorias(productos));
        renderizarCatalogo();
        actualizarCarrito();
    } catch (error) {
        console.error(error);
        estado.textContent = "No se pudo cargar el catálogo. Verifique que abrió la página con Live Server.";
        estado.classList.add("estado--error");
    } finally {
        grilla.setAttribute("aria-busy", "false");
    }
}

iniciar();