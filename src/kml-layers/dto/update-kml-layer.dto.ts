import { PartialType } from '@nestjs/mapped-types';
import { CreateKmlLayerDto } from './create-kml-layer.dto';

export class UpdateKmlLayerDto extends PartialType(CreateKmlLayerDto) {}
