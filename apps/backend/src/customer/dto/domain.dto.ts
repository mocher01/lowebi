import {
  IsString,
  IsNotEmpty,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CheckAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(63)
  subdomain: string;
}

export class CreateDomainDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsIn(['subdomain', 'custom'])
  domainType: 'subdomain' | 'custom';

  @IsString()
  @IsNotEmpty()
  domain: string; // subdomain prefix OR full custom domain
}

export class DomainResponseDto {
  domain: string;
  status: string;
  url: string;
  tempDomain?: string;
  verificationToken?: string;
  verificationExpiry?: string;
}
