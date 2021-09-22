import {createClient} from './client.js';
import EntityDefinition from './factory/entity-definition.factory.js';
import EntityHydrator from './data/entity-hydrator.data.js';
import ChangesetGenerator from './data/changeset-generator.data.js';
import EntityFactory from './data/entity-factory.data.js';
import Repository from './data/repository.data.js';

export default class Api {
    constructor(url, token) {
        this.url = url;
        this.client = createClient(url, token)
    }

    async _initialize() {
        let schema = await this.client.get('_info/entity-schema.json');

        this.EntityDefinition = EntityDefinition;
        
        Object.keys(schema.data).forEach((entityName) => {
            this.EntityDefinition.add(entityName, schema.data[entityName]);
        });

        const hydrator = new EntityHydrator(this.EntityDefinition);
        const changesetGenerator = new ChangesetGenerator(this.EntityDefinition);
        const entityFactory = new EntityFactory();

        this.create = (entityName, route, options) => {
            if (!route) {
                route = `/${entityName.replace(/_/g, '-')}`;
            }
            options = options || {};

            const definition = this.EntityDefinition.get(entityName);

            return new Repository(
                route,
                definition.entity,
                this.client,
                hydrator,
                changesetGenerator,
                entityFactory,
                options
            );
        };
    }

    defaultContext() {
        return {
            apiPath: `${this.url}/api`,
            apiResourcePath: `${this.url}/api`,
            authToken: {
                access: this.client.token.access_token
            }
        }
    }
}