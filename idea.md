# Aplicació de Simulador Hipotecari

Aplicació web per a la simulació d'hipoteques a tipus fix amb el sistema francès, anàlisi de viabilitat financera (regla del 35%), desglossament d'impostos i despeses de compravenda a Catalunya (ITP general 10%, ITP reduït 5% i obra nova) i taula interactiva d'amortització any a any amb suport per a amortitzacions voluntàries.

## Característiques Implementades

1. **Paràmetres Principals**:
   - Preu de la vivenda (€)
   - Diners propis / Entrada mínima del 20% (€ i %)
   - Tipus d'interès fix anual TIN / TAE (%)
   - Termini de la hipoteca en anys (màxim 40 anys)
   - Règim d'impostos a Catalunya: ITP General (10%), ITP Reduït (5%) i Obra Nova (10% IVA + 1,5% AJD)
   - Desglossament de despeses de notaria, registre de la propietat, gestoria i taxació homologada

2. **Avaluació de Viabilitat Financera**:
   - Ràtio d'endeutament (DSTI): alerta si la quota mensual supera el 35% del sou net mensual.
   - Comprovació d'estalvis: càlcul del ~32-33% necessari (sense bonificar) o ~27-28% (amb ITP reduït), comparat amb els estalvis disponibles de l'usuari.
   - Recomanacions personalitzades segons el perfil financer.

3. **Quadre d'Amortització Interactiu (Sistema Francès)**:
   - Taula anual: Quota mensual, Total anual, Interessos pagats, Deute pagat, Amortització voluntària, Deute restant, Quotes pendents i Patrimoni acumulat.
   - Recàlcul instantani en introduir amortitzacions extres.
   - Eina d'aportació anual recurrent.
   - Resum d'anys i interessos estalviats.

4. **Visualització i Eines**:
   - Gràfic de donut de distribució de costos.
   - Gràfic d'evolució temporal de deute vs patrimoni acumulat.
   - Exportació a CSV/Excel i mode d'impressió/PDF.
   - Selector de tema fosc i clar.