const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const dados = await prisma.profissionais.findMany();
  console.log(dados);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());