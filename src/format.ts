/** Formata centavos (inteiro) como moeda BRL para leitura humana. */
export function centavosParaBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
