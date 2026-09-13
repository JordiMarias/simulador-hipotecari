# Simulador Hipotecari

Aplicació web moderna, interactiva i 100% client-side (sense requeriment de backend) per simular hipoteques a tipus fix seguint el **sistema d'amortització francès**, calcular la **viabilitat financera**, desglossar **despeses i impostos a Catalunya** (ITP 10%, ITP reduït 5% i Obra Nova) i permetre **amortitzacions voluntàries any a any** amb recàlcul automàtic de quotes i estalvi d'interessos.

---

## 🚀 Característiques Principals

1. **Càlcul de Viabilitat Financera**:
   - **Regla d'or del 35%**: Alerta en temps real si la quota mensual supera el 35% del salari net mensual (límit prudencial d'endeutament bancari).
   - **Comprovació d'Estalvis**: Calcula el total de diners necessaris (Entrada mínima del 20% + Impostos + Notaria + Registre + Gestoria + Taxació) i els compara amb els estalvis disponibles de l'usuari.
   - **Límits i Validacions**: Límit màxim legal de 40 anys i finançament màxim del 80% (mínim 20% de diners propis).

2. **Fiscalitat i Despeses de Compravenda a Catalunya**:
   - **ITP General (10%)**: Habitatge usat habitual.
   - **ITP Reduït (5%)**: Per a joves ($\le 32$ o $\le 35$ anys segons barems de la Generalitat), famílies nombroses, monoparentals o persones amb discapacitat.
   - **Obra Nova (11,5%)**: 10% IVA + 1,5% Actes Jurídics Documentats (AJD).
   - Desglossament detallat de notaria, registre de la propietat, gestoria i taxació homologada oficial.

3. **Quadre d'Amortització Interactiu (Sistema Francès)**:
   - Visualització any a any: Quota mensual, Total anual, Interessos pagats, Deute pagat, Amortització voluntària, Deute restant, Quotes pendents i Patrimoni acumulat.
   - **Amortitzacions extraordinàries**: Pots introduir imports a finals de qualsevol any per reduir capital pendent i recalcular automàticament les quotes dels anys següents.
   - **Eina d'Aportació Recurrent**: Simula aportacions fixes anuals (p. ex., 3.000€ cada any) amb un sol clic.
   - Indicador de liquidació anticipada i càlcul d'anys i interessos estalviats.

4. **Visualització i Exportació**:
   - Gràfic de donut de distribució de costos (Capital vs Interessos vs Despeses).
   - Gràfic d'evolució temporal del Deute vs Patrimoni acumulat.
   - Exportació completa del quadre a **CSV / Excel** (amb caràcters UTF-8 i format numèric europeu).
   - Format d'impressió i generació d'informe **PDF**.
   - Selector de **Mode Fosc / Mode Clar** (Dark / Light mode).

---

## 🛠️ Com Executar l'Aplicació

L'aplicació és completament estàtica i autònoma. Pots obrir-la directament o iniciar un servidor local:

### Opció 1: Obrir directament
Obre el fitxer `index.html` amb qualsevol navegador web modern (Chrome, Firefox, Safari, Edge).

### Opció 2: Servidor de desenvolupament local
```bash
# Amb Python
python3 -m http.server 3000

# O amb Node.js / npx serve
npx -y serve .
```
Obre el navegador a `http://localhost:3000`.

---

## 📐 Fórmules Matemàtiques

### 1. Quota Mensual del Sistema Francès
$$M = K \cdot \frac{r_m \cdot (1 + r_m)^n}{(1 + r_m)^n - 1}$$
on:
- $K$: Capital prestat restant (€)
- $r_m = \frac{\text{TIN}}{12 \cdot 100}$: Tipus d'interès mensual
- $n = \text{anys} \times 12$: Nombre de mesos restants

### 2. Ràtio d'Endeutament (DSTI)
$$\text{DSTI} = \left( \frac{\text{Quota Mensual}}{\text{Salari Net Mensual}} \right) \times 100$$
- $\le 30\%$: Excel·lent (🟢 Viable)
- $30\% - 35\%$: Al límit recomanat (🟡 Atenció)
- $> 35\%$: Risc elevat (🔴 Inviable)

---

## 📄 Llicència
Projecte sota llicència MIT.
