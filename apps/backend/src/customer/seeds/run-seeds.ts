import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CustomerTemplate } from '../entities/customer-template.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { seedTemplates } from './templates.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('Starting database seeding...');

    const templateRepository = app.get<Repository<CustomerTemplate>>(
      getRepositoryToken(CustomerTemplate),
    );

    await seedTemplates(templateRepository);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
