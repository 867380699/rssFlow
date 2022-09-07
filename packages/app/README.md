# Ionic Vue Template

><https://github.com/aaronksaunders/ionicv6-beta-vue-vite-project>

# Decorator

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

- class declaration
- property
- method
- parameter
- accessor

```ts
@classDecorator
class Person {
  @propertyDecorator
  public name: string;

  @accessorDecorator
  get fullName() {
    // ...
  }

  @methodDecorator
  printName(@parameterDecorator prefix: string) {
    // ...
  }
}
```