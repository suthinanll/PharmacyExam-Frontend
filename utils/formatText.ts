/**
 * Utility for formatting scientific text, chemical formulas, and mathematical notation
 * Supports automatic superscript (^) and subscript (_) conversion to HTML <sup> and <sub>.
 *
 * Examples:
 *  - H_2O           -> H<sub>2</sub>O
 *  - CO_{2}         -> CO<sub>2</sub>
 *  - Ca^{2+}        -> Ca<sup>2+</sup>
 *  - Ca^2+          -> Ca<sup>2+</sup>
 *  - 10^{-3}        -> 10<sup>-3</sup>
 *  - mg/m^2         -> mg/m<sup>2</sup>
 *  - SO_4^{2-}      -> SO<sub>4</sub><sup>2-</sup>
 */

export function formatScientificText(text: string | null | undefined): string {
    if (!text) return "";

    let formatted = text;

    // 1. Bracketed superscripts: ^{2+}, ^{-3}, ^{x+1} -> <sup>...</sup>
    formatted = formatted.replace(/\^{([^}]+)}/g, "<sup>$1</sup>");

    // 2. Bracketed subscripts: _{2}, _{max}, _{1/2} -> <sub>...</sub>
    formatted = formatted.replace(/_{([^}]+)}/g, "<sub>$1</sub>");

    // 3. Simple superscripts: ^2+, ^2-, ^2, ^-3, ^+ -> <sup>...</sup>
    formatted = formatted.replace(/\^([0-9]+[+-]?|[+-][0-9]*|[a-zA-Z]+)/g, "<sup>$1</sup>");

    // 4. Simple subscripts in chemical/scientific formulas: H_2, O_2, C_6H_12O_6 -> <sub>...</sub>
    formatted = formatted.replace(/_([0-9]+[+-]?|[a-zA-Z0-9]+)/g, "<sub>$1</sub>");

    // 5. Units with superscripts: mg/m2, g/cm3, m2, m3, cm2, cm3, mm2, mm3
    formatted = formatted.replace(/\b(mg|g|kg|mcg|mol|mmol)\/(m|cm|mm)2\b/gi, "$1/$2<sup>2</sup>");
    formatted = formatted.replace(/\b(mg|g|kg|mcg|mol|mmol)\/(m|cm|mm)3\b/gi, "$1/$2<sup>3</sup>");
    formatted = formatted.replace(/\b(m|cm|mm|dm)2\b/gi, "$1<sup>2</sup>");
    formatted = formatted.replace(/\b(m|cm|mm|dm)3\b/gi, "$1<sup>3</sup>");

    // 6. Specific ion / pump patterns: H+, K+, Na+, Ca2+, Mg2+, Cl-, Fe2+, Fe3+, OH-, HCO3-, etc.
    // Handles expressions like H+/K+ ATPase, H+ / K+ ATPase, Na+/K+ pump, Ca2+
    formatted = formatted.replace(
        /(?:\b|(?<=[^A-Za-z0-9]))(H|K|Na|Ca|Mg|Cl|Fe|Zn|Cu|Ba|Al|Li|Ag|NH4|HCO3|OH|SO4|NO3|PO4)([0-9]*[+-])(?=[\s\/\-),.;:!?]|$)/g,
        function (match, element, charge) {
            const base = element.replace(/([A-Za-z\)\]])([0-9]+)/g, "$1<sub>$2</sub>");
            return base + "<sup>" + charge + "</sup>";
        }
    );

    // 7. Chemical formulas with subscripts (e.g. Mg(OH)2, Al(OH)3, Na2SO4, Na2CO3, H2O, CO2, CaCl2, C6H12O6)
    formatted = formatted.replace(
        /(?:\b|(?<=[^A-Za-z0-9]))((?:[A-Z][a-z]?|\([A-Za-z0-9]+\)|\[[A-Za-z0-9]+\])(?:[0-9]*(?:[A-Z][a-z]?|\([A-Za-z0-9]+\)|\[[A-Za-z0-9]+\]))*[0-9]+(?:\([A-Za-z0-9]+\)|\[[A-Za-z0-9]+\]|[A-Z][a-z]?[0-9]*)*)(?=[\s\/\-),.;:!?]|$)/g,
        function (match, chemFormula) {
            return chemFormula.replace(/([A-Za-z\)\]])([0-9]+)/g, "$1<sub>$2</sub>");
        }
    );

    return formatted;
}

export default formatScientificText;
