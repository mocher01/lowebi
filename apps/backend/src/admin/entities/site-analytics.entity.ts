import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerSite } from '../../customer/entities/customer-site.entity';

export enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  CONTACT_FORM = 'contact_form',
  BUTTON_CLICK = 'button_click',
  DOWNLOAD = 'download',
  EXTERNAL_LINK = 'external_link',
}

@Entity('site_analytics')
@Index(['siteId'])
@Index(['eventType'])
@Index(['timestamp'])
@Index(['visitorId'])
export class SiteAnalytics {
  @ApiProperty({ description: 'Unique analytics event identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Event type', enum: AnalyticsEventType })
  @Column()
  eventType: AnalyticsEventType;

  @ApiProperty({ description: 'Page or resource path' })
  @Column({ length: 500 })
  page: string;

  @ApiProperty({ description: 'Visitor unique identifier' })
  @Column({ name: 'visitor_id' })
  visitorId: string;

  @ApiProperty({ description: 'Session identifier' })
  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @ApiProperty({ description: 'Visitor IP address' })
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @ApiProperty({ description: 'User agent string' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @ApiProperty({ description: 'Referrer URL' })
  @Column({ nullable: true })
  referrer: string;

  @ApiProperty({ description: 'Event metadata JSON' })
  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: any) => (value ? JSON.stringify(value) : null),
      from: (value: string) => (value ? JSON.parse(value) : null),
    },
  })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Geographic location data' })
  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: any) => (value ? JSON.stringify(value) : null),
      from: (value: string) => (value ? JSON.parse(value) : null),
    },
  })
  location: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };

  @ApiProperty({ description: 'Device information' })
  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: any) => (value ? JSON.stringify(value) : null),
      from: (value: string) => (value ? JSON.parse(value) : null),
    },
  })
  device: {
    type?: string;
    browser?: string;
    os?: string;
    screenResolution?: string;
  };

  // Relations
  @ApiProperty({ description: 'Associated site ID' })
  @Column({ name: 'site_id' })
  siteId: string;

  @ManyToOne(() => CustomerSite, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: CustomerSite;

  @ApiProperty({ description: 'Event timestamp' })
  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  constructor(partial: Partial<SiteAnalytics>) {
    Object.assign(this, partial);
  }
}
