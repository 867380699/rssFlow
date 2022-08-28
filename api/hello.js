export default function handler(request, response) {
  const { name } = request.query;
  console.log(request, response);
  response.status(200).send(`Hello ${name}!`);
}