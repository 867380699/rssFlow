import { faker } from '@faker-js/faker';


export interface Message {
  fromName: string;
  subject: string;
  date: string;
  id: number;
}

const messages: Message[] = Array.from({length: 50}).map((_,i)=>({
  fromName: faker.person.fullName(),
  subject: faker.lorem.lines(1),
  date: faker.word.noun(),
  id: i
}))

export const getMessages = () => messages.concat(messages);

export const getMessage = (id: number) => messages.find(m => m.id === id);